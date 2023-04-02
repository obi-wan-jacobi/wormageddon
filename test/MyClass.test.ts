import MyClass from '@my-folder/MyClass';

describe('test MyClass', () => {
  it('should say hello', () => {
    expect(`${new MyClass()}`).toBe('Hello MyClass!');
  });
});
