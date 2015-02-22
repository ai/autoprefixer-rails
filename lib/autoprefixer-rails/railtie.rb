require 'yaml'

begin
  require 'sprockets/railtie'

  module AutoprefixedRails
    class Railtie < ::Rails::Railtie
      rake_tasks do |app|
        require 'rake/autoprefixer_tasks'
        Rake::AutoprefixerTasks.new( config(app.root)[0] )
      end

      if config.respond_to?(:assets)
        config.assets.configure do |env|
          AutoprefixerRails.install(env, *config(env.root))
        end
      else
        initializer :setup_autoprefixer, group: :all do |app|
          AutoprefixerRails.install(app.assets, *config(app.root))
        end
      end

      # Read browsers requirements from application config
      def config(root)
        file   = File.join(root, 'config/autoprefixer.yml')
        params = ::YAML.load_file(file) if File.exist?(file)
        params ||= {}
        params = params.symbolize_keys

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
