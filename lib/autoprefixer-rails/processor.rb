=begin
Copyright 2013 Andrey “A.I.” Sitnik <andrey@sitnik.ru>,
sponsored by Evil Martians.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
=end

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
