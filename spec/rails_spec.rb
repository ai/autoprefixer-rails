require File.expand_path('../spec_helper', __FILE__)

describe CssController, :type => :controller do
  it "should integrate with Rails" do
    get :test
    response.should be_success
    response.body.should == PREFIXED
  end
end
