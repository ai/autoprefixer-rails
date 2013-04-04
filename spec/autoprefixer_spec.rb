require File.expand_path('../spec_helper', __FILE__)

describe AutoprefixerRails do
  before do
    @css = 'a { transition: 1s }'
  end

  it "should process CSS" do
    AutoprefixerRails.compile(@css).should == "a {\n" +
      "  -webkit-transition: 1s;\n  -o-transition: 1s;\n  transition: 1s\n}"
  end

  it "should process CSS for selected browsers" do
    AutoprefixerRails.compile(@css, ['chrome 25']).should == "a {\n" +
      "  -webkit-transition: 1s;\n  transition: 1s\n}"
  end

end
