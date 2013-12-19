require 'execjs'

module AutoprefixerRails
  # Ruby to JS wrapper for Autoprefixer processor instance
  class Processor
    def initialize(browsers=nil)
      @browsers = browsers || []
    end

    # Return prefixed `css`
    def compile(css)
      processor.call('compile', css)
    end

    # Return, which browsers and prefixes will be used
    def info
      processor.call('info')
    end

    # Lazy load for JS instance
    def processor
      @processor ||= ExecJS.compile(build_js)
    end

    private

    # Cache autoprefixer.js content
    def read_js
      @@js ||= Pathname(__FILE__).join("../../../vendor/autoprefixer.js").read
    end

    # Return processor JS with some extra methods
    def build_js
      create_global + read_js + create_instance +
      add_proxy('compile') + add_proxy('info')
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

    # Return JS code to create proxy methods
    def add_proxy(func)
      <<-JS
        var #{ func } = function() {
          return processor.#{ func }.apply(processor, arguments)
        };
      JS
    end
  end
end
