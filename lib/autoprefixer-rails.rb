# Ruby integration with Autoprefixer JS library, which parse CSS and adds
# only actual prefixed
module AutoprefixerRails
  autoload :Sprockets, 'autoprefixer-rails/sprockets'

  # Add prefixes to `css`. See `Processor#process` for options.
  def self.process(css, opts = { })
    browsers = opts.delete(:browsers)
    processor(browsers).process(css, opts)
  end

  # Add Autoprefixer for Sprockets environment in `assets`.
  # You can specify `browsers` actual in your project.
  def self.install(assets, browsers = nil)
    Sprockets.new( processor(browsers) ).install(assets)
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

require_relative 'autoprefixer-rails/result'
require_relative 'autoprefixer-rails/version'
require_relative 'autoprefixer-rails/processor'

require_relative 'autoprefixer-rails/railtie' if defined?(Rails)
