require 'pathname'

# Ruby integration with Autoprefixer JS library, which parse CSS and adds
# only actual prefixed
module AutoprefixerRails
  # Parse `css` and add vendor prefixes for `browsers`
  def self.compile(css, browsers = nil)
    processor(browsers).compile(css)
  end

  # Add Autoprefixer for Sprockets environment in `assets`.
  # You can specify `browsers` actual in your project.
  def self.install(assets, browsers = nil)
    instance = processor(browsers)
    assets.register_postprocessor 'text/css', :autoprefixer do |context, css|
      if defined?(Sass::Rails) or defined?(Sprockets::Sass)
        begin
          instance.compile(css)
        rescue ExecJS::ProgramError => e
          if e.message =~ /Can't parse CSS/
            css
          else
            raise e
          end
        end
      else
        instance.compile(css)
      end
    end
  end

  # Cache processor instances
  def self.processor(browsers)
    @cache ||= { }
    @cache[browsers] ||= Processor.new(browsers)
  end
end

dir = Pathname(__FILE__).dirname.join('autoprefixer-rails')

require dir.join('version').to_s
require dir.join('processor').to_s

require dir.join('railtie').to_s if defined?(Rails)
