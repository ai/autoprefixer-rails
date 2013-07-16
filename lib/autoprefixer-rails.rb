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

# Ruby integration with Autoprefixer JS library, which parse CSS and adds
# only actual prefixed
module AutoprefixerRails
  # Parse `css` and add vendor prefixes for `browsers`
  def self.compile(css, browsers = nil)
    compiler(browsers).compile(css)
  end

  # Add Autoprefixer for Sprockets environment in `assets`.
  # You can specify `browsers` actual in your project.
  def self.install(assets, browsers = nil)
    instance = compiler(browsers)
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

  # Cache compiler instances
  def self.compiler(browsers)
    @cache ||= { }
    @cache[browsers] ||= Compiler.new(browsers)
  end
end

dir = Pathname(__FILE__).dirname.join('autoprefixer-rails')

require dir.join('version').to_s
require dir.join('compiler').to_s

require dir.join('railtie').to_s if defined?(Rails)
