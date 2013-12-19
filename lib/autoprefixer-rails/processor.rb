require 'execjs'

module AutoprefixerRails
  # Ruby to JS wrapper for Autoprefixer processor instance
  class Processor
    def initialize(browsers=nil)
      @browsers = browsers || []
    end

    # Process `css` and return result.
    #
    # Options can be:
    # * `from` with input CSS file name. Will be used in error messages.
    # * `to` with output CSS file name.
    # * `map` with true to generate new source map or with previous map.
    def process(css, opts = { })
      result = processor.call('process', css, opts)
      Result.new(result['css'], result['map'])
    end

    # Return, which browsers and prefixes will be used
    def info
      processor.call('info')
    end

    # Lazy load for JS instance
    def processor
      @processor ||= ExecJS.compile(build_js)
    end

    # Deprecated method. Use `process` instead.
    def compile(css)
      warn 'autoprefixer-rails: Replace compile() to process(). ' +
           'Method compile() is deprecated and will be removed in 1.1.'
      processor.call('process', css)['css']
    end

    private

    # Print warning to logger or STDERR
    def warn(message)
      $stderr.puts(message)
    end

    # Cache autoprefixer.js content
    def read_js
      @@js ||= Pathname(__FILE__).join("../../../vendor/autoprefixer.js").read
    end

    # Return processor JS with some extra methods
    def build_js
      create_global + read_js + create_instance +
      process_proxy + info_proxy
    end

    # Return JS code to create `global` namespace
    def create_global
      'var global = this;'
    end

    # Return JS code to create Autoprefixer instance
    def create_instance
      if @browsers.empty?
        "var processor = autoprefixer;"
      else
        browsers = @browsers.map(&:to_s).join("', '")
        "var processor = autoprefixer('#{browsers}');"
      end
    end

    # Return JS code for process method proxy
    def process_proxy
      <<-JS
        var process = function() {
          var result = processor.process.apply(processor, arguments);
          return { css: result.css, map: result.map };
        };
      JS
    end

    # Return JS code for info method proxy
    def info_proxy
      <<-JS
        var info = function() {
          return processor.info.apply(processor);
        };
      JS
    end
  end
end
