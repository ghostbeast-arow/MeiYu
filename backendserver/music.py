import mysql.connector
import requests
import json
import time

# 数据库连接信息
username = 'root'
password = '12345678'
host = 'localhost'
port = '3306'
database_name = 'meiyu'


# 连接数据库并查询 "咏鹅" 的数据
def get_data_from_db():
    try:
        conn = mysql.connector.connect(
            user=username,
            password=password,
            host=host,
            port=port,
            database=database_name
        )
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM new_table WHERE id = '雁门太守行'")  # 查询id为"咏鹅"的记录
        result = cursor.fetchone()
        conn.close()
        if result:
            return result[0]
        else:
            print("没有找到id为'将进酒'的记录")
            return None
    except mysql.connector.Error as err:
        print(f"数据库连接或查询出错: {err}")
        return None


# 生成音乐并获取音频和视频 URL
def generate_music(prompt):
    url = "https://api.acedata.cloud/suno/audios"

    headers = {
        "accept": "application/json",
        "authorization": "Bearer d6cc400089ec40b88e387d475101b803",  # 使用你的 API 密钥
        "content-type": "application/json"
    }

    # 如果prompt长度超过200，截取前200个字符
    if len(prompt) > 200:
        print(f"警告：prompt长度超出200字符，正在截取前200个字符...")
        prompt = prompt[:200]

    payload = {
        "action": "generate",
        "prompt": prompt  # 使用用户提供的 prompt
    }

    # 禁用代理
    proxies = {
        "http": None,
        "https": None,
    }

    try:
        # 设置连接超时时间为15秒，读取超时时间为90秒
        response = requests.post(url, json=payload, headers=headers, proxies=proxies, timeout=(15, 90))

        if response.status_code == 200:
            result = response.json().get('data', [])
            if result:
                # 获取返回的音频和视频 URL
                audio_url = result[0].get("audio_url")
                video_url = result[0].get("video_url")
                return audio_url, video_url  # 返回音频和视频 URL
            else:
                print("API 返回的数据为空，未能生成音频和视频")
                return None, None
        else:
            print(f"API请求失败，状态码：{response.status_code}")
            if response.status_code == 401:
                print("可能是API密钥错误或无效")
            elif response.status_code == 403:
                print("可能是API访问权限被拒绝")
            elif response.status_code == 429:
                print("API请求频率过高，已达限制")
            else:
                print(f"其他API错误：{response.text}")
            return None, None
    except requests.exceptions.RequestException as e:
        print(f"请求异常: {e}")
        return None, None


# 带重试机制的 generate_music 函数
def generate_music_with_retry(prompt, retries=5, delay=10):
    for attempt in range(retries):
        audio_url, video_url = generate_music(prompt)
        if audio_url and video_url:
            return audio_url, video_url
        else:
            print(f"请求失败，重试第 {attempt + 1} 次...")
            time.sleep(delay)  # 增加重试之间的等待时间（10秒）
    print("所有重试均失败")
    return None, None


# 主程序
def main():
    # 从数据库中获取数据
    name = get_data_from_db()
    if name:
        print(f"从数据库获取的name: {name}")  # 打印从数据库中获取的name
        audio_url, video_url = generate_music_with_retry(name)
        if audio_url and video_url:
            print(f"生成的音频 URL: {audio_url}")
            print(f"生成的视频 URL: {video_url}")
        else:
            print("未能成功生成音乐或视频。请检查调试信息，了解失败原因。")
    else:
        print(f"没有找到id为{name}的数据")


if __name__ == "__main__":
    main()
