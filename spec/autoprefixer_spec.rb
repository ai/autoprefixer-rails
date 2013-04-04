require File.expand_path('../spec_helper', __FILE__)

describe AutoprefixerRails do
  before do
    @css = 'a { transition: all 1s }'
  end

  it "should process CSS for selected browsers" do
    AutoprefixerRails.compile(@css, ['chrome 25']).should ==
      "a {\n  -webkit-transition: all 1s;\n  transition: all 1s\n}"
  end

  it "should integrate with sprockets" do
    assets = Sprockets::Environment.new
    assets.append_path(DIR.join('css'))

    AutoprefixerRails.install(assets, ['chrome 25'])

    assets['test.css'].to_s.should ==
      "a {\n  -webkit-transition: all 1s;\n  transition: all 1s\n}"
  end
end
