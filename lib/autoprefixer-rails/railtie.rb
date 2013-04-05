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

module AutoprefixedRails
  class Railtie < ::Rails::Railtie
    initializer :setup do |app|
      app.config.after_initialize do |app|
        config   = app.root.join('config/autoprefixer.yml')
        browsers = config.exist? ? YAML.load_file(config) : []
        AutoprefixerRails.install(app.assets, browsers)
      end
    end
  end
end
