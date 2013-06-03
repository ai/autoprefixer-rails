# encoding: utf-8
ENV['RAILS_ENV'] ||= 'test'

DIR = Pathname(__FILE__).dirname
require DIR.join('app/config/environment').to_s
require DIR.join('../lib/autoprefixer-rails').to_s

require 'pp'
require 'sprockets'
require 'rspec/rails'

PREFIXED = "a {\n  -webkit-transition: all 1s;\n  transition: all 1s;\n}"
