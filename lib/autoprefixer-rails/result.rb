module AutoprefixerRails
  # Container of prefixed CSS and source map with changes
  class Result
    # Prefixed CSS after Autoprefixer
    attr_reader :css

    # Source map of changes
    attr_reader :map

    def initialize(css, map)
      @css = css
      @map = map
    end

    # Stringify prefixed CSS
    def to_s
      @css
    end
  end
end
