require_relative 'spec_helper'

describe AutoprefixerRails do
  before :all do
    @dir = Pathname(__FILE__).dirname
    @css = @dir.join('app/app/assets/stylesheets/test.css').read
  end

  it "process CSS" do
    expect(AutoprefixerRails.process(@css)).to be_a(AutoprefixerRails::Result)
  end

  it "process CSS for selected browsers" do
    result = AutoprefixerRails.process(@css, browsers: ['chrome 25'])
    expect(result.css).to eq "a {\n" +
                             "    -webkit-transition: all 1s;\n" +
                             "            transition: all 1s\n" +
                             "}\n"
  end

  it "generates source map" do
    result = AutoprefixerRails.process(@css, map: true)
    expect(result.map).to be_a(String)
  end

  it "convert options" do
    result = AutoprefixerRails.process @css,
      from: 'a.css',
      map:  { sources_content: true }
    expect(result.map).to include('"sourcesContent":["a {')
  end

  it "uses file name in syntax errors", not_jruby: true do
    expect {
      AutoprefixerRails.process('a {', from: 'a.css')
    }.to raise_error(/a.css:/)
  end

  it "has safe mode" do
    expect(AutoprefixerRails.process('a {', safe: true).css).to eql('a {}')
  end

  it "shows debug" do
    info = AutoprefixerRails.processor(browsers: ['chrome 25']).info
    expect(info).to match(/Browsers:\n  Chrome: 25\n\n/)
    expect(info).to match(/  transition: webkit/)
  end

  context 'Sprockets' do
    before :all do
      @assets = Sprockets::Environment.new
      @assets.append_path(@dir.join('app/app/assets/stylesheets'))
      AutoprefixerRails.install(@assets, browsers: ['chrome 25'])
    end

    it "integrates with Sprockets" do
      css = @assets['test.css'].to_s
      expect(css).to eq "a {\n" +
                        "    -webkit-transition: all 1s;\n" +
                        "            transition: all 1s\n" +
                        "}\n"
    end

    it "shows file name from Sprockets", not_jruby: true do
      expect { @assets['wrong.css'] }.to raise_error(/wrong.css:/)
    end

  end
end
