require File.expand_path('../spec_helper', __FILE__)

describe CssController, :type => :controller do
  before :all do
    Rails.root.join('tmp').rmtree
  end

  it "should integrate with Rails" do
    get :test, :file => 'test'
    response.should be_success
    response.body.should == PREFIXED
  end
end

describe 'Rake task' do
  it "should inspect" do
    inspect = `cd spec/app; bundle exec rake autoprefixer:inspect`
    inspect.should =~ /Browsers:\n  Chrome: 25\n\n/
    inspect.should =~ /  transition: webkit/
  end
end
