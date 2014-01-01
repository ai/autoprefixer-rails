require 'pathname'

module AutoprefixerRails
  # Register autoprefixer postprocessor in Sprockets and fix common issues
  class Sprockets
    def initialize(processor)
      @processor = processor
    end

    # Add prefixes for `css`
    def process(context, css)
      root   = Pathname.new(context.root_path)
      input  = context.pathname.relative_path_from(root).to_s
      output = input.chomp(File.extname(input)) + '.css'

      @processor.process(css, from: input, to: output).css
    end

    # Add prefixes only if in `content` will be CSS.
    def process_only_css(context, content)
      begin
        process(context, content)
      rescue ExecJS::ProgramError => e
        if e.message =~ /Can't parse CSS/
          content
        else
          raise e
        end
      end
    end

    # Register postprocessor in Sprockets depend on issues with other gems
    def install(assets)
      if ignore_syntax_error?
        register(assets) { |context, css| process_only_css(context, css) }
      else
        register(assets) { |context, css| process(context, css) }
      end
    end

    private

    # Add `block` as `assets` postprocessor
    def register(assets, &block)
      assets.register_postprocessor('text/css', :autoprefixer, &block)
    end

    # Return true if broken sass-rails is loaded
    def ignore_syntax_error?
      return false unless defined? Sass::Rails

      fixed   = Gem::Version.new('4.0.1')
      current = Gem::Version.new(Sass::Rails::VERSION)

      current < fixed
    end
  end
end
