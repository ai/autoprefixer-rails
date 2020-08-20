# frozen_string_literal: true

# Ruby integration with Autoprefixer JS library, which parse CSS and adds
# only actual prefixed
module AutoprefixerRails
  autoload :Sprockets, "autoprefixer-rails/sprockets"

  # Add prefixes to `css`. See `Processor#process` for options.
  def self.process(css, opts = {})
    params = {}
    params[:overrideBrowserslist] = opts.delete(:overrideBrowserslist) if opts.key?(:overrideBrowserslist)
    params[:browsers] = opts.delete(:browsers) if opts.key?(:browsers)
    params[:cascade]  = opts.delete(:cascade)  if opts.key?(:cascade)
    params[:remove]   = opts.delete(:remove)   if opts.key?(:remove)
    params[:env]      = opts.delete(:env)      if opts.key?(:env)
    processor(params).process(css, opts)
  end

  # Add Autoprefixer for Sprockets environment in `assets`.
  # You can specify `browsers` actual in your project.
  def self.install(assets, params = {})
    Sprockets.register_processor(processor(params))
    Sprockets.install(assets)
  end

  # Disable installed Autoprefixer
  def self.uninstall(assets)
    Sprockets.uninstall(assets)
  end

  # Cache processor instances
  def self.processor(params = {})
    Processor.new(params)
  end

  def self.show_deprecation_message!
    return unless defined?(ActiveSupport::Deprecation)

    return if defined?(@deprecation_shown)

    ActiveSupport::Deprecation.warn(
      "autoprefixer-rails was deprected. Migration guide:\n" \
      "https://github.com/ai/autoprefixer-rails/wiki/Deprecated"
    )

    @deprecation_shown = true
  end
end

require_relative "autoprefixer-rails/result"
require_relative "autoprefixer-rails/version"
require_relative "autoprefixer-rails/processor"

require_relative "autoprefixer-rails/railtie" if defined?(Rails)
