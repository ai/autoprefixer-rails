begin
  require 'sprockets/railtie'

  module AutoprefixedRails
    class Railtie < ::Rails::Railtie
      rake_tasks do |app|
        require 'rake/autoprefixer_tasks'
        Rake::AutoprefixerTasks.new( config(app)[0] )
      end

      initializer :setup_autoprefixer, group: :all do |app|
        AutoprefixerRails.install(app.assets, *config(app))
      end

      # Read browsers requirements from application config
      def config(app)
        file   = app.root.join('config/autoprefixer.yml')
        params = file.exist? ? YAML.load_file(file).symbolize_keys : { }

        opts   = { }
        opts[:safe] = true if params.delete(:safe)

        if params[:browsers]
          ActiveSupport::Deprecation.warn(
            'browsers key in config/autoprefixer.yml was deprecated. ' +
            'Use browserslist config.')
        end

        [params, opts]
      end
    end
  end
rescue LoadError
end
