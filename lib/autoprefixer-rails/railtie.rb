begin
  require 'sprockets/railtie'

  module AutoprefixedRails
    class Railtie < ::Rails::Railtie
      rake_tasks do |app|
        require 'rake/autoprefixer_tasks'
        Rake::AutoprefixerTasks.new(*config(app))
      end

      initializer :setup_autoprefixer, group: :all do |app|
        AutoprefixerRails.install(app.assets, *config(app))
      end

      # Read browsers requirements from application config
      def config(app)
        file    = app.root.join('config/autoprefixer.yml')
        options = file.exist? ? YAML.load_file(file).symbolize_keys : { }
        options = { browsers: nil }.merge(options)
        [options.delete(:browsers), options]
      end
    end
  end
rescue LoadError
end
