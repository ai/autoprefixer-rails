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

  def self.install(assets, browsers = [])
    assets.register_postprocessor 'text/css', :autoprefixer do |context, css|
      AutoprefixerRails.compile(css, browsers)
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
end
