import { later } from '../../../test';
import { mountForm, submitForm, getSimpleRules } from './shared';

test('rules prop - execute order', async () => {
  const onFailed = jest.fn();
  const wrapper = mountForm({
    template: `
      <van-form @failed="onFailed">
        <van-field name="A" :rules="rules" value="123" />
        <van-button native-type="submit" />
      </van-form>
    `,
    data() {
      return {
        rules: [
          { required: true, message: 'A' },
          { validator: val => val.length > 6, message: 'B' },
          { validator: val => val !== 'foo', message: 'C' },
        ],
      };
    },
    methods: {
      onFailed,
    },
  });

  await submitForm(wrapper);

  expect(onFailed).toHaveBeenCalledWith({
    errors: [{ message: 'B', name: 'A' }],
    values: { A: '123' },
  });
});

test('rules prop - async validator', async () => {
  const onFailed = jest.fn();
  const wrapper = mountForm({
    template: `
      <van-form @failed="onFailed">
        <van-field name="A" :rules="rules" value="123" />
        <van-button native-type="submit" />
      </van-form>
    `,
    data() {
      return {
        rules: [
          {
            validator: () => new Promise(resolve => resolve(true)),
            message: 'should pass',
          },
          {
            validator: () => new Promise(resolve => resolve(false)),
            message: 'should fail',
          },
        ],
      };
    },
    methods: {
      onFailed,
    },
  });

  await submitForm(wrapper);

  expect(onFailed).toHaveBeenCalledWith({
    errors: [{ message: 'should fail', name: 'A' }],
    values: { A: '123' },
  });
});

test('validate-first prop', async () => {
  const onSubmit = jest.fn();
  const onFailed = jest.fn();

  const wrapper = mountForm({
    template: `
      <van-form validate-first @submit="onSubmit" @failed="onFailed">
        <van-field name="A" :rules="rulesA" :value="value" />
        <van-field name="B" :rules="rulesB" :value="value" />
        <van-button native-type="submit" />
      </van-form>
    `,
    data() {
      return {
        ...getSimpleRules(),
        value: '',
      };
    },
    methods: {
      onSubmit,
      onFailed,
    },
  });

  await submitForm(wrapper);

  expect(wrapper).toMatchSnapshot();
  expect(onFailed).toHaveBeenCalledWith({
    errors: [{ message: 'A failed', name: 'A' }],
    values: { A: '', B: '' },
  });

  wrapper.setData({ value: 'foo' });
  await submitForm(wrapper);

  expect(onSubmit).toHaveBeenCalledWith({ A: 'foo', B: 'foo' });
});

test('colon prop', () => {
  const wrapper = mountForm({
    template: `
      <van-form colon>
        <van-field label="Label" />
        <van-field>
          <template #label>Custom Label</template>
        </van-field>
      </van-form>
    `,
  });
  expect(wrapper).toMatchSnapshot();
});

test('label-align prop', () => {
  const wrapper = mountForm({
    template: `
      <van-form label-align="right">
        <van-field label="Label" />
        <van-field label="Label" label-align="center" />
      </van-form>
    `,
  });
  expect(wrapper).toMatchSnapshot();
});

test('label-width prop', () => {
  const wrapper = mountForm({
    template: `
      <van-form label-width="5rem">
        <van-field label="Label" />
        <van-field label="Label" label-width="10vw" />
      </van-form>
    `,
  });
  expect(wrapper).toMatchSnapshot();
});

test('input-align prop', () => {
  const wrapper = mountForm({
    template: `
      <van-form input-align="right">
        <van-field />
        <van-field>
          <div slot="input" />
        </van-field>
      </van-form>
    `,
  });
  expect(wrapper).toMatchSnapshot();
});

test('error-message-align prop', () => {
  const wrapper = mountForm({
    template: `
      <van-form error-message-align="right">
        <van-field error-message="Error" />
      </van-form>
    `,
  });
  expect(wrapper).toMatchSnapshot();
});

test('validate-trigger - onBlur', async () => {
  const wrapper = mountForm({
    template: `
      <van-form ref="form">
        <van-field name="A" :rules="rulesA" value="" />
      </van-form>
    `,
    data: getSimpleRules,
  });

  const input = wrapper.find('input');

  input.trigger('input');
  await later();
  expect(wrapper.contains('.van-field__error-message')).toBeFalsy();

  input.trigger('blur');
  await later();
  expect(wrapper.contains('.van-field__error-message')).toBeTruthy();
});

test('validate-trigger - onChange', async () => {
  const wrapper = mountForm({
    template: `
      <van-form validate-trigger="onChange" ref="form">
        <van-field v-model="value" name="A" :rules="rulesA" />
      </van-form>
    `,
    data() {
      return {
        ...getSimpleRules(),
        value: '',
      };
    },
  });

  const input = wrapper.find('input');

  input.trigger('blur');
  await later();
  expect(wrapper.contains('.van-field__error-message')).toBeFalsy();

  wrapper.setData({ value: '1' });
  await later();
  expect(wrapper.contains('.van-field__error-message')).toBeFalsy();

  wrapper.setData({ value: '' });
  await later();
  expect(wrapper.contains('.van-field__error-message')).toBeTruthy();
});

test('validate-trigger - custom trigger in rules', async () => {
  const wrapper = mountForm({
    template: `
      <van-form validate-trigger="none" ref="form">
        <van-field name="A" :rules="rulesA" :value="valueA" />
        <van-field name="B" :rules="rulesB" :value="valueB" />
      </van-form>
    `,
    data() {
      return {
        valueA: '',
        valueB: '',
        rulesA: [
          {
            message: 'A',
            required: true,
            trigger: 'onChange',
          },
        ],
        rulesB: [
          {
            message: 'B',
            required: true,
            trigger: 'onBlur',
          },
        ],
      };
    },
  });

  const inputs = wrapper.findAll('input');

  inputs.at(0).trigger('blur');
  wrapper.setData({ valueB: '1' });
  await later();
  wrapper.setData({ valueB: '' });
  await later();
  expect(wrapper.contains('.van-field__error-message')).toBeFalsy();

  inputs.at(1).trigger('blur');
  wrapper.setData({ valueA: '1' });
  await later();
  wrapper.setData({ valueA: '' });
  await later();
  expect(
    wrapper.element.querySelectorAll('.van-field__error-message').length
  ).toEqual(2);
});
