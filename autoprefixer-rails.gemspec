require './lib/autoprefixer-rails/version'

Gem::Specification.new do |s|
  s.platform    = Gem::Platform::RUBY
  s.name        = 'autoprefixer-rails'
  s.version     = AutoprefixerRails::VERSION.dup
  s.date        = Time.now.strftime('%Y-%m-%d')
  s.summary     = 'Parse CSS and add only actual prefixed by Can I Use database'
  s.description = 'Parse CSS and add prefixed properties and values ' +
                  'by Can I Use database for actual browsers'

  s.files            = `git ls-files`.split("\n")
  s.test_files       = `git ls-files -- {spec}/*`.split("\n")
  s.extra_rdoc_files = ['README.md', 'LICENSE', 'ChangeLog']
  s.require_path     = 'lib'

  s.author   = 'Andrey "A.I." Sitnik'
  s.email    = 'andrey@sitnik.ru'
  s.homepage = 'https://github.com/ai/autoprefixer-rails'

  s.add_dependency "execjs", [">= 0"]
end
