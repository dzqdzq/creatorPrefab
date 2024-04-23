import React, { KeyboardEventHandler, useState, useEffect, useContext } from 'react';
import { VSCodeButton, VSCodeTextField, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react';
import { vscode } from "./utilities/vscode";
// 帮我导入css样式文件
import './App.css';

type CardProps = {
  children: React.ReactNode;
  onRemove: () => void;
};

const MyDiv = ({ data, onClose }: { data: object, onClose: () => void }) => {
  return (
    <div style={{ position: 'relative' }}>
      <div className="panel">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="item">
            <span className="key">{key}</span>: <span className="value">{value}</span>
          </div>
        ))}
      </div>
      <VSCodeButton style={{
        position: 'absolute',
        top: '0px',
        right: '0px',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        padding: '1px',
        fontSize: '0.5rem',
        backgroundColor: 'gray',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
        onClick={onClose}>x</VSCodeButton>
    </div>
  );
};

const Card = ({ children, onRemove }: CardProps) => {
  return (
    <div style={{
      // border: '1px solid #ccc',
      // borderRadius: '10px',
      padding: '0px',
      margin: '0px',
      position: 'relative'
    }}>
      {children}
      <VSCodeButton style={{
        position: 'absolute',
        top: '0px',
        right: '0px',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        padding: '1px',
        fontSize: '0.5rem',
        backgroundColor: 'gray',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
        onClick={onRemove}>x</VSCodeButton>
    </div>
  );
};

const Welcome = () => {
  return (
    <div style={{ justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <h1>creator资源查询功能介绍</h1><br />
      <h2>使用案例:</h2>
      <p>1. 输入长UUID: e24d07b2-28d6-4a7e-aa88-91598af8bd80</p>
      <p>2. 输入短UUID: e24d0eyKNZKfqqIkVmK+L2A</p>
      <p>3. 输入路径Path(查图片动画等): new_guide.png</p>
      <p>4. 输入路径Path(查脚本): NewGuideView.ts</p>
      <p>5. 输入路径Path(查功能): resource/activity/demo</p>
      <p>6. 输入/clear: 清除所有查询结果</p>
      <p>如果根据路径查,要写cocos creator项目的相对路径</p>
    </div>
  );
};

const CardList = (props: { items: object[], removeItem: (index: number) => void }) => {
  const { items, removeItem } = props;
  return (
    <div style={{ height: 'calc(100vh - 60px)', overflowY: 'scroll' }}>
      {items.length === 0 && <Welcome />}
      {items.map((item: object, index: number) => <MyDiv data={item} onClose={() => removeItem(index)} />)}
    </div>
  );
};

const SearchBar = ({ onSearch }: { onSearch: (value: string) => void }) => {
  const [value, setValue] = useState<string>('');

  const handleSearch: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      if (e.target) {
        const content = e.target as HTMLInputElement;
        onSearch(content.value);
      }
      setValue('');
    }
  };

  return (
    <VSCodeTextField
      value={value}
      onChange={(e) => {
        console.log('VSCodeTextField===', e.target);
      }}
      placeholder="Enter a UUID or Path or '/clear' to clear all items."
      onKeyDown={handleSearch}
      maxlength={512}
      style={{ width: '100%' }}
    />
  );
};

const Toast = ({ message }: { message: string }) => {
  if (!message) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', padding: '10px', borderRadius: '5px' }}>
      {message}
    </div>
  );
};

const App = () => {
  const [items, setItems] = useState<object[]>([]);
  const [toastMessage, setToastMessage] = useState('');

  const handleSearch = (inputValue: string) => {
    if (!inputValue) {
      return;
    }
    if (inputValue === '/clear') {
      setItems([]);
      return;
    }
    vscode.postMessage({ command: 'parseUUID', text: inputValue });
  };

  useEffect(() => {
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.command === 'parseUUID_resp') {
        console.log('search===', message.text);
        const info = message.text;
        if (info.code) {
          setToastMessage('uuid invaild');
          setTimeout(() => {
            setToastMessage('');
          }, 1200);
          return;
        }
        setItems((prevItems: object[]) => [...prevItems, info]);
      }
    });
  }, []);

  const removeItem = (index: number) => {
    setItems((prevItems: object[]) => prevItems.filter((_: any, i: number) => i !== index));
  };

  return (
    <div>
      <CardList items={items} removeItem={removeItem} />
      <SearchBar onSearch={handleSearch} />
      <Toast message={toastMessage} />
    </div>
  );
};

export default App;