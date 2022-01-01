import { Expect, Equal } from '../src/types/helpers';
import { match, __, when, not, Pattern, P } from '../src';
import { State, Event } from './utils';

describe('types', () => {
  type Input = [State, Event];

  it('wildcard patterns should typecheck', () => {
    let pattern: Pattern<Input>;
    pattern = __;
    pattern = [__, __];
    pattern = [{ status: 'success', data: '' }, __];
    pattern = [{ status: 'success', data: P.string }, __];
    pattern = [{ status: 'success', data: __ }, __];
    pattern = [{ status: 'error', error: new Error() }, __];
    pattern = [{ status: 'idle' }, __];
    pattern = [__, { type: 'fetch' }];
    pattern = [__, { type: __ }];
    pattern = [{ status: 'idle' }, { type: 'fetch' }];
    pattern = [{ status: __ }, { type: __ }];
  });

  it('guard patterns should typecheck', () => {
    const pattern1: Pattern<Input> = when(() => true);
    const pattern2: Pattern<Input> = when((x) => {
      type t = Expect<Equal<typeof x, Input>>;
      return true;
    });

    const pattern3: Pattern<Input> = [
      when((state) => {
        type t = Expect<Equal<typeof state, State>>;
        return !!state;
      }),
      when((event) => {
        type t = Expect<Equal<typeof event, Event>>;
        return !!event;
      }),
    ];

    const pattern3_1: Pattern<Input> = [
      __,
      { type: when((t: Event['type']) => true) },
    ];

    const pattern4: Pattern<Input> = [
      {
        status: 'success',
        data: when((d) => {
          type t = Expect<Equal<typeof d, string>>;
          return true;
        }),
      },
      __,
    ];

    const pattern4_1: Pattern<Input> = [{ status: 'error', data: '' }, __];

    const pattern5: Pattern<Input> = [
      __,
      { type: when((t: Event['type']) => true) },
    ];

    const isFetch = (type: string): type is 'fetch' => type === 'fetch';

    const pattern6: Pattern<Input> = [__, { type: when(isFetch) }];

    const pattern7: Pattern<{ x: string }> = {
      x: when((x) => {
        type t = Expect<Equal<typeof x, string>>;
        return true;
      }),
    };

    const pattern8: Pattern<[{ x: string }]> = [
      {
        x: when((x) => {
          type t = Expect<Equal<typeof x, string>>;
          return true;
        }),
      },
    ];

    const pattern9: Pattern<[{ x: string }, { y: number }]> = [
      {
        x: when((x) => {
          type t = Expect<Equal<typeof x, string>>;
          return true;
        }),
      },
      {
        y: when((y) => {
          type t = Expect<Equal<typeof y, number>>;
          return true;
        }),
      },
    ];

    const pattern10: Pattern<string | number> = when((x) => {
      type t = Expect<Equal<typeof x, string | number>>;
      return true;
    });
  });

  it('should infer values correctly in handler', () => {
    type Input = { type: string; hello?: { yo: number } } | string;

    const res = match<Input>({ type: 'hello' })
      .with(__, (x) => {
        type t = Expect<Equal<typeof x, Input>>;
        return 'ok';
      })
      .with(P.string, (x) => {
        type t = Expect<Equal<typeof x, string>>;
        return 'ok';
      })
      .with(
        when((x) => true),
        (x) => {
          type t = Expect<Equal<typeof x, Input>>;
          return 'ok';
        }
      )
      .with(
        when<Input>((x) => {
          type t = Expect<Equal<typeof x, Input>>;
          return true;
        }),
        (x) => {
          type t = Expect<Equal<typeof x, Input>>;
          return 'ok';
        }
      )
      .with(not('hello' as const), (x) => {
        type t = Expect<Equal<typeof x, Input>>;
        return 'ok';
      })
      .with(not(P.string), (x) => {
        type t = Expect<
          Equal<
            typeof x,
            {
              type: string;
              hello?: {
                yo: number;
              };
            }
          >
        >;
        return 'ok';
      })
      .with(not(when((x) => true)), (x) => {
        type t = Expect<Equal<typeof x, Input>>;
        return 'ok';
      })
      .with({ type: __ }, (x) => {
        type t = Expect<
          Equal<
            typeof x,
            {
              type: string;
              hello?: {
                yo: number;
              };
            }
          >
        >;
        return 'ok';
      })
      .with({ type: P.string }, (x) => {
        type t = Expect<
          Equal<typeof x, { type: string; hello?: { yo: number } | undefined }>
        >;
        return 'ok';
      })
      .with({ type: when((x) => true) }, (x) => {
        type t = Expect<
          Equal<typeof x, { type: string; hello?: { yo: number } | undefined }>
        >;
        return 'ok';
      })
      .with({ type: not('hello' as 'hello') }, (x) => {
        type t = Expect<
          Equal<
            typeof x,
            {
              type: string;
              hello:
                | {
                    yo: number;
                  }
                | undefined;
            }
          >
        >;
        return 'ok';
      })
      .with({ type: not(P.string) }, (x) => {
        type t = Expect<Equal<typeof x, Input>>;
        return 'ok';
      })
      .with({ type: not(when((x) => true)) }, (x) => {
        type t = Expect<Equal<typeof x, Input>>;
        return 'ok';
      })
      .with(not({ type: when((x) => true) }), (x) => {
        type t = Expect<Equal<typeof x, string>>;
        return 'ok';
      })
      .with(not({ type: P.string }), (x) => {
        type t = Expect<Equal<typeof x, string>>;
        return 'ok';
      })
      .run();

    const inferenceCheck: string = res;
  });

  it('a union of object or primitive should be matched with a correct type inference', () => {
    type Input =
      | string
      | number
      | boolean
      | { type: string }
      | string[]
      | [number, number];

    match<Input>({ type: 'hello' })
      .with({ type: __ }, (x) => {
        type t = Expect<Equal<typeof x, { type: string }>>;
        return 'ok';
      })
      .with(P.string, (x) => {
        type t = Expect<Equal<typeof x, string>>;
        return 'ok';
      })
      .with(P.number, (x) => {
        type t = Expect<Equal<typeof x, number>>;
        return 'ok';
      })
      .with(P.boolean, (x) => {
        type t = Expect<Equal<typeof x, boolean>>;
        return 'ok';
      })
      .with({ type: P.string }, (x) => {
        type t = Expect<Equal<typeof x, { type: string }>>;
        return 'ok';
      })
      .with([P.string], (x) => {
        type t = Expect<Equal<typeof x, [string]>>;
        return 'ok';
      })
      .with([P.number, P.number], (x) => {
        type t = Expect<Equal<typeof x, [number, number]>>;
        return 'ok';
      })
      .run();
  });

  describe('Unknown Input', () => {
    const users: unknown = [{ name: 'Gabriel', postCount: 20 }];

    const typedUsers = match(users)
      .with([{ name: P.string, postCount: P.number }], (users) => users)
      .otherwise(() => []);

    // type of `typedUsers` is { name: string, postCount: number }[]

    expect(
      typedUsers
        .map((user) => `<p>${user.name} has ${user.postCount} posts.</p>`)
        .join('')
    ).toEqual(`<p>Gabriel has 20 posts.</p>`);
  });

  it("should enforce all branches return the right type when it's set", () => {
    match<number, number>(2)
      //  @ts-expect-error
      .with(2, () => 'string')
      //  @ts-expect-error
      .otherwise(() => '?');
  });
});
