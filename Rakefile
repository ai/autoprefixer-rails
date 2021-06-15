# frozen_string_literal: true

require "rubygems"

require "bundler/setup"
Bundler::GemHelper.install_tasks

require "standard/rake"

require "rspec/core/rake_task"
RSpec::Core::RakeTask.new
task default: [:spec, "standard:fix"]

task :clobber_package do
  begin
    rm_r "pkg"
  rescue StandardError
    nil
  end
end

desc "Delete all generated files"
task clobber: [:clobber_package]
