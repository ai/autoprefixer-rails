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
  end
end
