require 'pathname'
require 'execjs'

module AutoprefixerRails
  # Ruby to JS wrapper for Autoprefixer processor instance
  class Processor
    def initialize(params = {})
      @params = params
    end

    # Process `css` and return result.
    #
    # Options can be:
    # * `from` with input CSS file name. Will be used in error messages.
    # * `to` with output CSS file name.
    # * `map` with true to generate new source map or with previous map.
    def process(css, opts = {})
      opts   = convert_options(opts)
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

    # Convert ruby_options to jsOptions
    def convert_options(opts)
      converted = { }

      opts.each_pair do |name, value|
        if name =~ /_/
          name = name.to_s.gsub(/_\w/) { |i| i.gsub('_', '').upcase }.to_sym
        end
        value = convert_options(value) if value.is_a? Hash
        converted[name] = value
      end

      converted
    end

    private

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
      params = @params.map { |k, v| "#{k}: #{v.inspect}"}.join(', ')
      "var processor = autoprefixer({ #{params} });"
    end

    # Return JS code for process method proxy
    def process_proxy
      <<-JS
        var process = function() {
          var result = processor.process.apply(processor, arguments);
          var map    = result.map ? result.map.toString() : null;
          return { css: result.css, map: map };
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
