# encoding: utf-8
ENV['RAILS_ENV'] ||= 'test'

DIR = Pathname(__FILE__).dirname
require DIR.join('app/config/environment').to_s
require DIR.join('../lib/autoprefixer-rails').to_s

require 'pp'
require 'sprockets'
require 'rspec/rails'

PREFIXED = "a { -webkit-transition: all 1s; transition: all 1s }\n"

RSpec.configure do |c|
  c.filter_run_excluding not_jruby: RUBY_PLATFORM == 'java'
end
