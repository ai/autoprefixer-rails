# frozen_string_literal: true

require "pathname"

module AutoprefixerRails
  # Register autoprefixer postprocessor in Sprockets and fix common issues
  class Sprockets
    def self.register_processor(processor)
      @processor = processor
    end

    # Sprockets 3 and 4 API
    def self.call(input)
      filename     = input[:filename]
      source       = input[:data]
      previous_map = input[:metadata] && input[:metadata][:map]

      output = filename.chomp(File.extname(filename)) + ".css"
      map_param = previous_map ? {
        inline: false, # do not generate inline source map
        prev: false, # omit previous source map if embedded in source css
        annotation: false, # do not append source map comment to css
        sourcesContent: false,
      } : nil
      result = @processor.process(source, from: filename, to: output, map: map_param)

      result.warnings.each do |warning|
        warn "autoprefixer: #{warning}"
      end

      css = result.css
      map = result.map && JSON.parse(result.map)
      if previous_map && map
        # map = ::Sprockets::SourceMapUtils.format_source_map(map, input)
        map = ::Sprockets::SourceMapUtils.combine_source_maps previous_map, map
      end

      {
        data: css,
        map: map || previous_map,
      }
    end

    # Add prefixes to `css`
    def self.run(filename, css)
      output = filename.chomp(File.extname(filename)) + ".css"
      result = @processor.process(css, from: filename, to: output)

      result.warnings.each do |warning|
        warn "autoprefixer: #{warning}"
      end

      result.css
    end

    # Register postprocessor in Sprockets depend on issues with other gems
    def self.install(env)
      if ::Sprockets::VERSION.to_f < 4
        env.register_postprocessor("text/css",
                                   ::AutoprefixerRails::Sprockets)
      else
        env.register_bundle_processor("text/css",
                                      ::AutoprefixerRails::Sprockets)
      end
    end

    # Register postprocessor in Sprockets depend on issues with other gems
    def self.uninstall(env)
      if ::Sprockets::VERSION.to_f < 4
        env.unregister_postprocessor("text/css",
                                     ::AutoprefixerRails::Sprockets)
      else
        env.unregister_bundle_processor("text/css",
                                        ::AutoprefixerRails::Sprockets)
      end
    end

    # Sprockets 2 API new and render
    def initialize(filename)
      @filename = filename
      @source   = yield
    end

    # Sprockets 2 API new and render
    def render(*)
      self.class.run(@filename, @source)
    end
  end
end
