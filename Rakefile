require 'rubygems'

require 'bundler/setup'
Bundler::GemHelper.install_tasks

require 'rspec/core/rake_task'
RSpec::Core::RakeTask.new
task :default => :spec

task :clobber_package do
  rm_r 'pkg' rescue nil
end

desc 'Delete all generated files'
task :clobber => [:clobber_package]

desc 'Update JS file for Autoprefixer'
task :update do
  require 'tmpdir'
  require 'pathname'

  git  = 'https://github.com/ai/autoprefixer.git'
  file = Pathname(__FILE__).dirname.join('vendor/autoprefixer.js')

  Dir.mktmpdir do |tmp|
    `cd #{tmp}; git clone #{git} ./; npm install; node_modules/.bin/cake build`
    file.delete if file.exist?
    mv File.join(tmp, 'autoprefixer.js'), file.to_s
  end
end
