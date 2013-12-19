require File.expand_path('../spec_helper', __FILE__)

describe AutoprefixerRails do
  it "process CSS" do
    css = DIR.join('app/app/assets/stylesheets/test.css').read
    AutoprefixerRails.compile(css).should be_a(String)
  end
  it "process CSS for selected browsers" do
    css = DIR.join('app/app/assets/stylesheets/test.css').read
    AutoprefixerRails.compile(css, ['chrome 25']).should == PREFIXED
  end

  it "integrates with Sprockets" do
    assets = Sprockets::Environment.new
    assets.append_path(DIR.join('app/app/assets/stylesheets'))

    AutoprefixerRails.install(assets, ['chrome 25'])

    assets['test.css'].to_s.should == PREFIXED
  end

  it "shows debug" do
    info = AutoprefixerRails.compiler(['chrome 25']).info
    info.should =~ /Browsers:\n  Chrome: 25\n\n/
    info.should =~ /  transition: webkit/
  end
end
