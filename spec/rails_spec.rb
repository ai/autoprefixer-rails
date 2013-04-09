require File.expand_path('../spec_helper', __FILE__)

describe CssController, :type => :controller do
  it "should integrate with Rails" do
    get :test, :file => 'test'
    response.should be_success
    response.body.should == PREFIXED
  end

  it "should not compile foreign styles" do
    get :test, :file => 'foreign'
    response.should be_success
    response.body.should == ".f { transition: none }\n"
  end
end
