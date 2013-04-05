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
end
