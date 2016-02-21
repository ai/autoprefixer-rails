require 'pathname'

module AutoprefixerRails
  # Register autoprefixer postprocessor in Sprockets and fix common issues
  class Sprockets
    def self.register_processor(processor)
      @processor = processor
    end

    # Sprockets 2 API new and render
    def initialize(filename, &block)
      @filename = filename
      @source   = block.call
    end

    # Sprockets 2 API new and render
    def render(_, _)
      self.class.run(@filename, @source)
    end

    # Sprockets 3 and 4 API
    def self.call(input)
      filename  = input[:source_path] || input[:filename]
      source    = input[:data]
      run(filename, source)
    end

    def self.run(filename, source)
      output = filename.chomp(File.extname(filename)) + '.css'
      result = @processor.process(source, from: filename, to: output)

      result.warnings.each do |warning|
        $stderr.puts "autoprefixer: #{ warning }"
      end

      result.css
    end

    # Register postprocessor in Sprockets depend on issues with other gems
    def self.install(assets)
      assets.register_postprocessor('text/css', ::AutoprefixerRails::Sprockets)
    end
  end
end
