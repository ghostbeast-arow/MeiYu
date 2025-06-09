import mysql.connector
import requests
import json
from time import sleep

# 数据库连接信息
username = 'root'
password = '12345678'
host = 'localhost'
port = '3306'
database_name = 'meiyu'


# 连接数据库并查询 "咏鹅" 的数据
def get_data_from_db():
    conn = mysql.connector.connect(
        user=username,
        password=password,
        host=host,
        port=port,
        database=database_name
    )
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM new_table WHERE id = '咏鹅'")  # 查询id为"咏鹅"的记录
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None


# 发送请求，生成视频
def text2video(prompt):
    url = "http://video.ohyesai.com/api/image2video-create"  # 视频生成API URL

    # 构造要发送的数据
    files = {'prompt': prompt}  # 传递视频描述作为prompt

    # 发送POST请求
    response = requests.post(url, files=files)

    # 检查请求是否成功
    if response.status_code == 200:
        data_dict = response.json()
        task_id = data_dict.get("data")  # 获取任务ID
        if task_id:
            video_url = get_outcome(task_id)  # 通过任务ID获取视频URL
            return video_url  # 返回视频URL
        else:
            print("没有返回有效的任务ID")
            return None
    else:
        print(f"请求失败，状态码：{response.status_code}")
        return None


# 获取视频生成结果
def get_outcome(task_id):
    url = f"http://video.ohyesai.com/api/image2video-result/{task_id}"  # 用任务ID查询视频结果
    retries = 0
    while retries < 10:
        response = requests.get(url)
        if response.status_code == 200:
            data_dict = response.json()
            # 假设返回的 JSON 结构包含 "code" 和 "data" 字段
            if data_dict.get("code") == 201:  # 201表示视频正在生成中
                print("视频正在处理中，等待...")
                sleep(5)  # 等待 5 秒后继续重试
            else:
                video_url = data_dict.get("data")  # 获取视频的 URL
                return video_url  # 返回生成的视频URL
        else:
            print(f"请求失败，状态码：{response.status_code}, 正在重试...")
            sleep(2)  # 请求失败后稍等再重试
        retries += 1
    print("请求超时，无法获取视频链接")
    return None


# 主程序
def main():
    # 从数据库中获取数据
    name = get_data_from_db()
    if name:
        # 调用API生成视频
        print(f"从数据库获取的name: {name}")  # 打印从数据库中获取的name
        video_url = text2video(name)
        if video_url:
            print(f"生成的视频URL: {video_url}")
        else:
            print("未能成功生成视频")
    else:
        print("没有找到id为'咏鹅'的数据")


if __name__ == "__main__":
    main()
