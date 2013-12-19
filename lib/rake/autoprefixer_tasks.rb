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

require 'rake'
require 'rake/tasklib'
require 'autoprefixer-rails'

module Rake
  # Define task to inspect Autoprefixer browsers, properties and values.
  # Call it from your `Rakefile`:
  #
  #   AutoprefixerTasks.new(['> 1%', 'opera 12'])
  class AutoprefixerTasks < Rake::TaskLib
    attr_reader :browsers

    def initialize(browsers = [])
      @browsers = browsers
      @processor = AutoprefixerRails.processor(@browsers)
      define
    end

    def define
      namespace :autoprefixer do
        desc 'Show selected browsers and prefixed CSS properties and values'
        task :info do
          puts @processor.info
        end
      end
    end
  end
end
