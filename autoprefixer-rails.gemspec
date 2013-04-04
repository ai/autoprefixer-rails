require './lib/autoprefixer-rails/version'

Gem::Specification.new do |s|
  s.platform    = Gem::Platform::RUBY
  s.name        = 'autoprefixer-rails'
  s.version     = AutoprefixerRails::VERSION.dup
  s.date        = Time.now.strftime('%Y-%m-%d')
  s.summary     = 'Parse CSS and add only actual prefixed'
  s.description = <<-EOF
    Parse CSS and add prefixed properties and values
    when it really necessary for selected browsers.
  EOF

  s.files            = `git ls-files`.split("\n")
  s.test_files       = `git ls-files -- {spec}/*`.split("\n")
  s.extra_rdoc_files = ['README.md', 'LICENSE']
  s.require_path     = 'lib'

  s.author   = 'Andrey "A.I." Sitnik'
  s.email    = 'andrey@sitnik.ru'
  s.homepage = 'https://github.com/ai/autoprefixer-rails'

  s.add_dependency "execjs", [">= 0"]

  s.add_development_dependency "bundler",   [">= 1.0.10"]
  s.add_development_dependency "rake",      [">= 0"]
  s.add_development_dependency "rspec",     [">= 0"]
end
