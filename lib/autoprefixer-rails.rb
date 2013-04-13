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

require 'pathname'
require 'execjs'

# Ruby integration with Autoprefixer JS library, which parse CSS and adds
# only actual prefixed.
module AutoprefixerRails
  # Parse `css` and add vendor prefixes for `browsers`.
  def self.compile(css, browsers = [])
    compiler.call('autoprefixer.compile', css, browsers)
  end

  # Add Autoprefixer for Sprockets environment in `assets`. You can specify
  # `browsers` actual in your project. Also, you can set options with
  # whitelist of `dirs` to be autoprefxied.
  def self.install(assets, browsers = [], opts = { })
    assets.register_postprocessor 'text/css', :autoprefixer do |context, css|
      path = context.pathname.to_s
      if opts[:dirs] and opts[:dirs].none? { |i| path.starts_with? i.to_s }
        css
      else
        AutoprefixerRails.compile(css, browsers)
      end
    end
  end

  # Path to Autoprefixer JS library
  def self.js_file
    Pathname(__FILE__).dirname.join('../vendor/autoprefixer.js')
  end

  # Get loaded JS contex with Autoprefixer
  def self.compiler
    @compiler ||= ExecJS.compile("window = this;\n" + js_file.read)
  end

  # Return string with selected browsers and prefixed CSS properties and values
  def self.inspect(browsers = [])
    compiler.call('autoprefixer.inspect', browsers)
  end
end

if defined?(Rails)
  require Pathname(__FILE__).dirname.join('autoprefixer-rails/railtie').to_s
end
