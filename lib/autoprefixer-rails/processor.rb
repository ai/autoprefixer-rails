# frozen_string_literal: true

require "pathname"
require "execjs"
require "json"

module AutoprefixerRails
  IS_SECTION = /^\s*\[(.+)\]\s*$/.freeze

  # Ruby to JS wrapper for Autoprefixer processor instance
  class Processor
    SUPPORTED_RUNTIMES = [ExecJS::Runtimes::Node, ExecJS::Runtimes::MiniRacer]

    def initialize(params = {})
      @params = params || {}
    end

    # Process `css` and return result.
    #
    # Options can be:
    # * `from` with input CSS file name. Will be used in error messages.
    # * `to` with output CSS file name.
    # * `map` with true to generate new source map or with previous map.
    def process(css, opts = {})
      opts = convert_options(opts)

      plugin_opts = params_with_browsers(opts[:from]).merge(opts)
      process_opts = {
        from: plugin_opts.delete(:from),
        to: plugin_opts.delete(:to),
        map: plugin_opts.delete(:map)
      }

      begin
        result = runtime.call("autoprefixer.process", css, process_opts, plugin_opts)
      rescue ExecJS::ProgramError => e
        contry_error = "BrowserslistError: " \
          "Country statistics are not supported " \
          "in client-side build of Browserslist"
        if e.message == contry_error
          raise "Country statistics is not supported in AutoprefixerRails. " \
            "Use Autoprefixer with webpack or other Node.js builder."
        else
          raise e
        end
      end

      Result.new(result["css"], result["map"], result["warnings"])
    end

    # Return, which browsers and prefixes will be used
    def info
      runtime.call("autoprefixer.info", params_with_browsers)
    end

    # Parse Browserslist config
    def parse_config(config)
      sections = { "defaults" => [] }
      current  = "defaults"
      config.gsub(/#[^\n]*/, "")
            .split(/\n/)
            .map(&:strip)
            .reject(&:empty?)
            .each do |line|
        if IS_SECTION =~ line
          current = line.match(IS_SECTION)[1].strip
          sections[current] ||= []
        else
          sections[current] << line
        end
      end
      sections
    end

    private

    def params_with_browsers(from = nil)
      from ||= if defined?(Rails) && Rails.respond_to?(:root) && Rails.root
                 Rails.root.join("app/assets/stylesheets").to_s
               else
                 "."
               end

      params = @params
      if !params.key?(:browsers) && !params.key?(:overrideBrowserslist) && from
        file = find_config(from)
        if file
          env    = params[:env].to_s || "development"
          config = parse_config(file)
          params = params.dup
          params[:overrideBrowserslist] = (config[env] || config["defaults"])
        end
      end

      params
    end

    # Convert ruby_options to jsOptions
    def convert_options(opts)
      converted = {}

      opts.each_pair do |name, value|
        if /_/ =~ name
          name = name.to_s.gsub(/_\w/) { |i| i.delete("_").upcase }.to_sym
        end
        value = convert_options(value) if value.is_a? Hash
        converted[name] = value
      end

      converted
    end

    # Try to find Browserslist config
    def find_config(file)
      path = Pathname(file).expand_path

      while path.parent != path
        config1 = path.join("browserslist")
        return config1.read if config1.exist? && !config1.directory?

        config2 = path.join(".browserslistrc")
        return config2.read if config2.exist? && !config1.directory?

        path = path.parent
      end

      nil
    end

    # Lazy load for JS library
    def runtime
      @runtime ||= begin
        ExecJS.compile(build_js)
      rescue ExecJS::RuntimeError
        # Only complain about unsupported runtimes when it failed to parse our script.

        case ExecJS.runtime
        when ExecJS::Runtimes::Node
          node_command = ExecJS.runtime.send(:binary) rescue "Unknown"

          raise <<~MSG
            Your nodejs binary failed to load autoprefixer script file,
            please check if you're running a supported version (10, 12, 14+)

            ENV["PATH"] = #{ENV["PATH"]}
            binary      = #{node_command}
          MSG
        when *SUPPORTED_RUNTIMES
          raise
        else
          raise <<~MSG
            Your ExecJS runtime #{ExecJS.runtime.name} isn't supported by autoprefixer-rails,
            please switch to #{SUPPORTED_RUNTIMES.map(&:name).join(' or ')}
          MSG
        end
      end
    end

    def build_js
      root = Pathname(File.dirname(__FILE__))
      path = root.join("../../vendor/autoprefixer.js")
      path.read
    end
  end
end
