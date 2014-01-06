ENV['RAILS_ENV'] ||= 'test'

require 'pp'
require 'sprockets'

require_relative 'app/config/environment'
require_relative '../lib/autoprefixer-rails'

require 'rspec/rails'

PREFIXED = "a { -webkit-transition: all 1s; transition: all 1s }\n"

RSpec.configure do |c|
  c.filter_run_excluding not_jruby: RUBY_PLATFORM == 'java'
end
