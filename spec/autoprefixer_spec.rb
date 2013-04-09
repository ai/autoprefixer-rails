require File.expand_path('../spec_helper', __FILE__)

describe AutoprefixerRails do
  it "should process CSS for selected browsers" do
    css = DIR.join('app/app/assets/stylesheets/test.css').read
    AutoprefixerRails.compile(css, ['chrome 25']).should == PREFIXED
  end

  it "should integrate with sprockets" do
    assets = Sprockets::Environment.new
    assets.append_path(DIR.join('app/app/assets/stylesheets'))

    AutoprefixerRails.install(assets, ['chrome 25'])

    assets['test.css'].to_s.should == PREFIXED
  end

  it "should has dirs whitelist" do
    assets = Sprockets::Environment.new
    assets.append_path(DIR.join('app/'))
    dirs = [DIR.join('app/vendor')]

    AutoprefixerRails.install(assets, ['chrome 25'], :dirs => dirs)

    assets['vendor/assets/stylesheets/foreign.css'].to_s.should ==
      ".f {\n  -webkit-transition: none;\n  transition: none\n}"
    assets['app/assets/stylesheets/test.css'].to_s.should ==
      "a { transition: all 1s }\n"
  end
end
