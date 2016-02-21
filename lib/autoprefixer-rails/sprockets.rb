require 'pathname'

module AutoprefixerRails
  # Autoprefixer Sprockets postprocessor
  module Sprockets
    module_function

    def processor=(processor)
      @processor = processor
    end

    # Add prefixes for `css`
    def call(input)
      result = @processor.process(input[:data], from: input[:filename])

      result.warnings.each do |warning|
        $stderr.puts "autoprefixer: #{ warning }"
      end

      result.css
    end

    # Sprockets 2 support below
    def new(path, &block)
      Sprockets2Renderer.new(path, &block)
    end

    class Sprockets2Renderer
      def initialize(path, &block)
        @path = path
        @data = block.call
      end

      def render(_scope, _locals = {}, &_block)
        ::AutoprefixerRails::Sprockets.call(data: @data, filename: @path)
      end
    end
  end
end
