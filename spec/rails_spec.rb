require File.expand_path('../spec_helper', __FILE__)

describe CssController, :type => :controller do
  it "should integrate with Rails" do
    get :test, :file => 'test'
    response.should be_success
    response.body.should == "a {\n" +
                            "  -webkit-transition: all 1s;\n" +
                            "  transition: all 1s\n" +
                            "}"
  end

  it "should not compile foreign styles" do
    get :test, :file => 'foreign'
    response.should be_success
    response.body.should == ".f { transition: none }\n"
  end
end

describe 'Rake task' do
  it "should inspect" do
    inspect = `cd spec/app; bundle exec rake autoprefixer:inspect`
    inspect.should =~ /Browsers:\n  Chrome 25\n\n/
    inspect.should =~ /  transition: webkit/
  end
end
