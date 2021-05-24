# frozen_string_literal: true

require File.expand_path("lib/autoprefixer-rails/version", __dir__)

Gem::Specification.new do |s|
  s.platform    = Gem::Platform::RUBY
  s.name        = "autoprefixer-rails"
  s.version     = AutoprefixerRails::VERSION.dup
  s.date        = Time.now.strftime("%Y-%m-%d")
  s.summary     = "Parse CSS and add vendor prefixes to CSS rules using " \
    "values from the Can I Use website."

  s.files = Dir["{lib,vendor}/**/*", "LICENSE", "CHANGELOG.md", "README.md"]
  s.extra_rdoc_files = ["README.md", "LICENSE", "CHANGELOG.md"]
  s.require_path     = "lib"
  s.required_ruby_version = ">= 2.4"

  s.author   = "Andrey Sitnik"
  s.email    = "andrey@sitnik.ru"
  s.homepage = "https://github.com/ai/autoprefixer-rails"
  s.license  = "MIT"

  s.add_dependency "execjs", "~> 2"

  s.add_development_dependency "rails"
  s.add_development_dependency "rake"
  s.add_development_dependency "rspec-rails"
  s.add_development_dependency "rubocop", "~> 0.85.1"
  s.add_development_dependency "rubocop-packaging", "~> 0.1.1"
  s.add_development_dependency "standard"

  s.metadata["changelog_uri"] = "https://github.com/ai/autoprefixer-rails/blob/master/CHANGELOG.md"
  s.metadata["source_code_uri"] = "https://github.com/ai/autoprefixer-rails"
  s.metadata["bug_tracker_uri"] = "https://github.com/ai/autoprefixer-rails/issues"
end
