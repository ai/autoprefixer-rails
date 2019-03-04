self.sourcemap = true
self.output_style = :compressed
self.sass_options = {cache: false}

require "rubygems"
require "bundler"
Bundler.require
require "../../lib/autoprefixer-rails"

on_stylesheet_saved do |file|
  css = File.read(file)
  map = file + ".map"

  if File.exist? map
    result = AutoprefixerRails.process(css,
      browsers: ["chrome 25"],
      from: file,
      to: file,
      map: {prev: File.read(map), inline: false})
    File.open(file, "w") { |io| io << result.css }
    File.open(map,  "w") { |io| io << result.map }
  else
    File.open(file, "w") do |io|
      io << AutoprefixerRails.process(css, browsers: ["chrome 25"])
    end
  end
end
