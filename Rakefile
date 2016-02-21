# coding: utf-8
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

desc 'Test all Gemfiles from spec/*.gemfile'
task :test_all_gemfiles do
  require 'pty'
  require 'shellwords'
  cmd      = 'bundle install --quiet && bundle exec rake --trace'
  statuses = Dir.glob('./spec/gemfiles/*{[!.lock]}').map do |gemfile|
    Bundler.with_clean_env do
      env = {'BUNDLE_GEMFILE' => gemfile}
      $stderr.puts "Testing #{File.basename(gemfile)}:\n  export #{env.map { |k, v| "#{k}=#{Shellwords.escape v}" } * ' '}; #{cmd}"
      PTY.spawn(env, cmd) do |r, _w, pid|
        begin
          r.each_line { |l| puts l }
        rescue Errno::EIO
          # Errno:EIO error means that the process has finished giving output.
        ensure
          ::Process.wait pid
        end
      end
      [$? && $?.exitstatus == 0, gemfile]
    end
  end
  failed_gemfiles = statuses.reject(&:first).map { |(_status, gemfile)| gemfile }
  if failed_gemfiles.empty?
    $stderr.puts "✓ Tests pass with all #{statuses.size} gemfiles"
  else
    $stderr.puts "❌ FAILING (#{failed_gemfiles.size} / #{statuses.size})\n#{failed_gemfiles * "\n"}"
    exit 1
  end
end
