import graceful from '../src/index';

// compose vs pipe

describe('@koex/graceful', () => {
  it('ok', () => {
    graceful();

    expect(true).toBeTruthy();
  });
});
