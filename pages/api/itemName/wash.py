import yaml
from tqdm import tqdm

# 假设你的YAML文件名为 'data.yaml'
input_filename = 'types.yml'
output_filename = 'data_modified.yml'

# 读取YAML文件
with open(input_filename, 'r', encoding='utf-8') as file:
  data = yaml.safe_load(file)

# print(type(data))

# print(data[0][0])

# # 检查data是否是一个列表，如果不是，将其转换为列表
# if not isinstance(data, list):
#   data = [data]

# 迭代数据并删除 'description' 字段
for i in data:
  if 'description' in data[i]:
    del data[i]['description']

# 将修改后的数据写回文件
with open(output_filename, 'w', encoding='utf-8') as file:
  yaml.safe_dump(data, file, allow_unicode=True)

print(f"The 'description' fields have been removed and saved to {output_filename}")