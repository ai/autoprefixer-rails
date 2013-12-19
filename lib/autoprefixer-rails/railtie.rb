begin
  require 'sprockets/railtie'

  module AutoprefixedRails
    class Railtie < ::Rails::Railtie
      rake_tasks do |app|
        require 'rake/autoprefixer_tasks'
        Rake::AutoprefixerTasks.new(browsers(app))
      end

      initializer :setup_autoprefixer, group: :all do |app|
        AutoprefixerRails.install(app.assets, browsers(app))
      end

      # Read browsers requirements from application config
      def browsers(app)
        file   = app.root.join('config/autoprefixer.yml')
        config = file.exist? ? YAML.load_file(file) : { 'browsers' => nil }
        config['browsers']
      end
    end
  end
rescue LoadError
end
