require 'pathname'

# Ruby integration with Autoprefixer JS library, which parse CSS and adds
# only actual prefixed
module AutoprefixerRails
  # Add prefixes to `css`. See `Processor#process` for options.
  def self.process(css, opts = { })
    browsers = opts.delete(:browsers)
    processor(browsers).process(css, opts)
  end

  # Add Autoprefixer for Sprockets environment in `assets`.
  # You can specify `browsers` actual in your project.
  def self.install(assets, browsers = nil)
    instance = processor(browsers)
    assets.register_postprocessor 'text/css', :autoprefixer do |context, css|

      root   = Pathname.new(context.root_path)
      input  = context.pathname.relative_path_from(root).to_s
      output = input.chomp(File.extname(input)) + '.css'

      if defined?(Sass::Rails) or defined?(Sprockets::Sass)
        begin
          instance.process(css, from: input, to: output).css
        rescue ExecJS::ProgramError => e
          if e.message =~ /Can't parse CSS/
            css
          else
            raise e
          end
        end
      else
        instance.process(css, from: input, to: output).css
      end
    end
  end

  # Cache processor instances
  def self.processor(browsers=nil)
    @cache ||= { }
    @cache[browsers] ||= Processor.new(browsers)
  end

  # Deprecated method. Use `process` instead.
  def self.compile(css, browsers = nil)
    processor(browsers).compile(css)
  end
end

dir = Pathname(__FILE__).dirname.join('autoprefixer-rails')

require dir.join('result').to_s
require dir.join('version').to_s
require dir.join('processor').to_s

require dir.join('railtie').to_s if defined?(Rails)
