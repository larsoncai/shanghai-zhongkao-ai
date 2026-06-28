"""2025上海中考演示数据。

学校名称用于增强演示真实感；分数线、名额、招生范围与趋势值均为产品演示数据，
不代表教育部门或学校发布的信息。
"""

DISTRICTS = [
    "黄浦区", "徐汇区", "长宁区", "静安区", "普陀区", "虹口区", "杨浦区", "浦东新区",
    "闵行区", "宝山区", "嘉定区", "金山区", "松江区", "青浦区", "奉贤区", "崇明区",
]


def _school(sid, name, district, line, trend=1, cross=None, featured=False):
    cross = cross or []
    return {
        "id": sid,
        "name": name,
        "district": district,
        "type": "市实验性示范性高中" if featured else "区实验性示范性高中",
        "cross_districts": cross,
        "trend": trend,
        "lines_2025": {
            "to_school": line - 11,
            "to_district": line - 5,
            "unified": line,
        },
        "quotas": {"to_district": 2 if featured else 1, "unified": 40 if featured else 70},
    }


ALL = DISTRICTS.copy()
SCHOOLS = [
    _school("shanghai", "上海中学", "徐汇区", 715, 2, ALL, True),
    _school("no2", "上海市第二中学", "徐汇区", 690, 1),
    _school("gezhi", "格致中学", "黄浦区", 704, 1, ALL, True),
    _school("datong", "大同中学", "黄浦区", 697, 1, ["徐汇区", "静安区", "浦东新区"], True),
    _school("yanan", "延安中学", "长宁区", 699, 2, ALL, True),
    _school("shixi", "市西中学", "静安区", 694, 1, ["普陀区", "长宁区"], True),
    _school("yucai", "育才中学", "静安区", 687, 0),
    _school("caoyang2", "曹杨第二中学", "普陀区", 696, 1, ALL, True),
    _school("jinshajiang", "金沙江中学", "普陀区", 670, 0),
    _school("fuxing", "复兴高级中学", "虹口区", 692, 1, ["杨浦区", "静安区"], True),
    _school("hongkou", "虹口高级中学", "虹口区", 675, 0),
    _school("kongjiang", "控江中学", "杨浦区", 701, 2, ALL, True),
    _school("yangpu", "杨浦高级中学", "杨浦区", 684, 1),
    _school("jianping", "建平中学", "浦东新区", 708, 2, ALL, True),
    _school("jincai", "进才中学", "浦东新区", 700, 1, ["闵行区", "徐汇区"], True),
    _school("yangjing", "洋泾中学", "浦东新区", 684, 1),
    _school("qibao", "七宝中学", "闵行区", 710, 2, ALL, True),
    _school("minhang", "闵行中学", "闵行区", 679, 1),
    _school("xingzhi", "行知中学", "宝山区", 694, 1, ["嘉定区", "杨浦区"], True),
    _school("wusong", "吴淞中学", "宝山区", 680, 0),
    _school("jiading1", "嘉定一中", "嘉定区", 691, 1, ["宝山区", "青浦区"], True),
    _school("jiading2", "嘉定二中", "嘉定区", 669, 0),
    _school("jinshan", "金山中学", "金山区", 688, 1, ["松江区", "奉贤区"], True),
    _school("huashi3", "华师大三附中", "金山区", 665, 0),
    _school("songjiang2", "松江二中", "松江区", 697, 1, ["青浦区", "金山区"], True),
    _school("songjiang1", "松江一中", "松江区", 675, 0),
    _school("qingpu", "青浦高级中学", "青浦区", 689, 1, ["嘉定区", "松江区"], True),
    _school("zhujiajiao", "朱家角中学", "青浦区", 666, 0),
    _school("fengxian", "奉贤中学", "奉贤区", 690, 1, ["金山区", "浦东新区"], True),
    _school("shuguang", "曙光中学", "奉贤区", 665, 0),
    _school("chongming", "崇明中学", "崇明区", 684, 1, ["宝山区", "浦东新区"], True),
    _school("yangzi", "扬子中学", "崇明区", 658, 0),
]

SCHOOL_BY_ID = {school["id"]: school for school in SCHOOLS}


def _middle(mid, name, district, quotas):
    return {"id": mid, "name": name, "district": district, "school_quotas": quotas}


LOCAL_SCHOOLS = {}
for school in SCHOOLS:
    LOCAL_SCHOOLS.setdefault(school["district"], []).append(school["id"])

MIDDLE_SCHOOLS = []
for index, district in enumerate(DISTRICTS, 1):
    local = LOCAL_SCHOOLS[district]
    featured = [school["id"] for school in SCHOOLS if school["type"].startswith("市")]
    first_quotas = {local[0]: 2, local[-1]: 1, featured[index % len(featured)]: 1}
    second_quotas = {local[0]: 1, local[-1]: 2, featured[(index + 3) % len(featured)]: 1}
    MIDDLE_SCHOOLS.extend([
        _middle(f"m{index}a", f"{district.replace('区', '')}实验初级中学", district, first_quotas),
        _middle(f"m{index}b", f"{district.replace('区', '')}联合初级中学", district, second_quotas),
    ])

MIDDLE_BY_ID = {school["id"]: school for school in MIDDLE_SCHOOLS}

BATCH_LABELS = {
    "to_school": "名额分配到校",
    "to_district": "名额分配到区",
    "unified": "统一招生",
}
