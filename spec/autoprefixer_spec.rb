require_relative 'spec_helper'

describe AutoprefixerRails do
  before :all do
    @dir = Pathname(__FILE__).dirname
    @css = @dir.join('app/app/assets/stylesheets/test.css').read
  end

  it "process CSS" do
    AutoprefixerRails.process(@css).should be_a(AutoprefixerRails::Result)
  end

  it "process CSS for selected browsers" do
    result = AutoprefixerRails.process(@css, browsers: ['chrome 25'])
    result.css.should == "a {\n" +
                         "    -webkit-transition: all 1s;\n" +
                         "            transition: all 1s\n" +
                         "}\n"
  end

  it "generates source map" do
    result = AutoprefixerRails.process(@css, map: true)
    result.map.should be_a(String)
  end

  it "creates visual cascade by default" do
    css    = "a {\n  transition: all 1s\n  }"
    result = AutoprefixerRails.process(@css)
    result.css.should == "a {\n" +
                         "    -webkit-transition: all 1s;\n" +
                         "            transition: all 1s\n" +
                         "}\n"
  end

  it "disables visual cascade on request" do
    css    = "a {\n  transition: all 1s\n  }"
    result = AutoprefixerRails.process(@css, cascade: false)
    result.css.should == "a {\n" +
                         "    -webkit-transition: all 1s;\n" +
                         "    transition: all 1s\n" +
                         "}\n"
  end

  it "uses file name in syntax errors", not_jruby: true do
    lambda {
      AutoprefixerRails.process('a {', from: 'a.css')
    }.should raise_error(/in a.css/)
  end

  it "shows debug" do
    info = AutoprefixerRails.processor(['chrome 25']).info
    info.should =~ /Browsers:\n  Chrome: 25\n\n/
    info.should =~ /  transition: webkit/
  end

  context 'Sprockets' do
    before :all do
      @assets = Sprockets::Environment.new
      @assets.append_path(@dir.join('app/app/assets/stylesheets'))
      AutoprefixerRails.install(@assets, ['chrome 25'])
    end

    it "integrates with Sprockets" do
      @assets['test.css'].to_s.should == "a {\n" +
                                         "    -webkit-transition: all 1s;\n" +
                                         "            transition: all 1s\n" +
                                         "}\n"
    end

    it "shows file name from Sprockets", not_jruby: true do
      lambda { @assets['wrong.css'] }.should raise_error(/in wrong.css/)
    end

  end
end
